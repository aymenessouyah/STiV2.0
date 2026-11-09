using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace STILabo3;

internal static class PackageInstaller
{
    // Restriction Windows même lorsque les tests sont exécutés sur un autre OS.
    internal static string SafePath(string root, string relative)
    {
        if (string.IsNullOrWhiteSpace(relative) || relative.Contains('\\') || relative.StartsWith('/') || relative.Length > 220)
            throw new InvalidDataException("Chemin de paquet invalide : " + relative);
        var parts = relative.Split('/');
        if (parts.Any(p => p is "" or "." or ".." || p.EndsWith('.') || p.EndsWith(' ') || p.Any(c => c < 32 || "<>:\"|?*".Contains(c)) ||
            Regex.IsMatch(p, @"\A(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\.|\z)", RegexOptions.IgnoreCase)))
            throw new InvalidDataException("Chemin Windows dangereux : " + relative);
        var prefix = Path.GetFullPath(root) + Path.DirectorySeparatorChar;
        var target = Path.GetFullPath(Path.Combine(root, Path.Combine(parts)));
        if (!target.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Chemin hors destination.");
        return target;
    }

    // Destination nouvelle et privée : jamais d'extraction dans une installation active.
    internal static async Task ExtractAsync(string package, string destination, IProgress<string>? progress = null)
    {
        if (Directory.Exists(destination)) throw new IOException("La destination doit être nouvelle.");
        using var archive = ZipFile.OpenRead(package);
        if (archive.Entries.Count > 20000) throw new InvalidDataException("Trop de fichiers.");
        var entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in archive.Entries)
        {
            SafePath(destination, entry.FullName);
            if (((entry.ExternalAttributes >> 16) & 0xF000) == 0xA000 || !entries.TryAdd(entry.FullName, entry))
                throw new InvalidDataException("Lien ou doublon interdit : " + entry.FullName);
        }
        if (!entries.TryGetValue("stipack.json", out var manifestEntry) || manifestEntry.FullName != "stipack.json" || manifestEntry.Length > 16 * 1024 * 1024)
            throw new InvalidDataException("Manifeste absent ou trop volumineux.");
        using var manifestStream = manifestEntry.Open();
        using var doc = await JsonDocument.ParseAsync(manifestStream);
        var manifest = doc.RootElement;
        if (manifest.GetProperty("format").GetString() != "STI-STIPACK/1" || manifest.GetProperty("volume").GetString() != "complet")
            throw new InvalidDataException("Un paquet STI-STIPACK/1 complet est requis.");
        var prefix = manifest.GetProperty("contenu").GetProperty("dossier").GetString();
        if (prefix is not ("" or "plateforme/")) throw new InvalidDataException("Disposition non prise en charge.");
        var files = manifest.GetProperty("fichiers").EnumerateArray().ToArray();
        if (files.Length is < 1 or > 19997) throw new InvalidDataException("Liste de fichiers invalide.");
        var announced = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var plan = new List<(ZipArchiveEntry Entry, string Relative, string Hash)>();
        long total = 0;
        foreach (var item in files)
        {
            var name = item.GetProperty("chemin").GetString()!;
            if (!name.StartsWith(prefix, StringComparison.Ordinal) || !announced.Add(name) || !entries.TryGetValue(name, out var entry) || entry.FullName != name)
                throw new InvalidDataException("Entrée absente, ambiguë ou dupliquée : " + name);
            var relative = name[prefix.Length..];
            SafePath(destination, relative);
            if (relative is "stipack.json" or "empreintes.txt" or "LISEZ-MOI.txt") throw new InvalidDataException("Collision de métadonnées.");
            var length = item.GetProperty("octets").GetInt64();
            var hash = item.GetProperty("sha256").GetString()!;
            if (length < 0 || length != entry.Length || !Regex.IsMatch(hash, @"\A[a-f0-9]{64}\z")) throw new InvalidDataException("Taille ou empreinte invalide : " + name);
            total = checked(total + length);
            if (total > 16L * 1024 * 1024 * 1024) throw new InvalidDataException("Paquet supérieur à 16 Gio.");
            plan.Add((entry, relative, hash));
        }
        if (!plan.Any(p => p.Relative == "index.html")) throw new InvalidDataException("Accueil index.html absent.");
        foreach (var name in entries.Keys)
            if (name is not ("stipack.json" or "empreintes.txt" or "LISEZ-MOI.txt") && !announced.Contains(name))
                throw new InvalidDataException("Fichier non annoncé : " + name);
        Directory.CreateDirectory(destination);
        try
        {
            var done = 0;
            foreach (var item in plan)
            {
                var target = SafePath(destination, item.Relative);
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                await using (var input = item.Entry.Open())
                await using (var output = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    await input.CopyToAsync(output);
                await using var check = File.OpenRead(target);
                var actual = Convert.ToHexString(await SHA256.HashDataAsync(check)).ToLowerInvariant();
                if (actual != item.Hash) throw new InvalidDataException("Fichier corrompu : " + item.Relative);
                progress?.Report($"{++done}/{plan.Count} — {item.Relative}");
            }
        }
        catch { Directory.Delete(destination, true); throw; }
    }
}
