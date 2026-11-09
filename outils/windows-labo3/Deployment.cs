namespace STILabo3;

internal static class Deployment
{
    // Chaque version pèse le poids de la plateforme (~1 Go en volume complet) :
    // sans purge, 20 mises à jour satureraient les postes du laboratoire.
    internal const int VersionsConservees = 2;
    internal const long MargeEspaceOctets = 250L * 1024 * 1024;

    internal static bool EspaceSuffisant(long requis, long disponible, long marge = MargeEspaceOctets)
        => requis >= 0 && disponible >= 0 && disponible - requis >= marge;

    internal static string RacineVersions() =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "STI-Labo3", "versions");

    /// Purge les anciennes versions, sans jamais toucher à la version protégée
    /// (celle en cours d'installation ou d'exécution) ni échouer l'installation :
    /// une version verrouillée par un processus reste simplement en place.
    internal static void NettoyerVersions(string racine, string? protegee, int conserver = VersionsConservees)
    {
        if (conserver < 1 || !Directory.Exists(racine)) return;
        // Noms préfixés par un horodatage UTC : l'ordre lexicologique est l'ordre réel.
        var versions = Directory.GetDirectories(racine)
            .Where(d => !Path.GetFileName(d).StartsWith('.'))
            .OrderByDescending(d => Path.GetFileName(d), StringComparer.Ordinal)
            .ToArray();
        string? protection = protegee is null ? null : Path.GetFullPath(protegee).TrimEnd(Path.DirectorySeparatorChar);
        foreach (var ancienne in versions.Skip(conserver))
        {
            var chemin = Path.GetFullPath(ancienne).TrimEnd(Path.DirectorySeparatorChar);
            if (protection is not null && chemin.Equals(protection, StringComparison.OrdinalIgnoreCase)) continue;
            try { Directory.Delete(ancienne, true); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }

    /// `authorization` est optionnel : null installe sans restriction de postes.
    internal static async Task<string> InstallAsync(string package, string? authorization, IProgress<string> progress)
    {
        if (authorization is not null) Authorization.Check(authorization);
        else progress.Report("Aucune autorisation sur le support : installation sans restriction de postes.");
        var root = RacineVersions();
        Directory.CreateDirectory(root);
        var version = Path.Combine(root, DateTime.UtcNow.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(version);
        try
        {
            var extraction = await PackageInstaller.ExtractAsync(package, Path.Combine(version, "plateforme"), progress);
            if (extraction.DoublonsIgnores.Count > 0)
            {
                // Windows ne peut pas stocker deux fichiers dont le chemin ne diffère
                // que par la casse : le premier annoncé est installé, les autres sont tracés ici.
                File.WriteAllLines(Path.Combine(version, "doublons-ignores.txt"),
                    ["# Fichiers du paquet absents du disque : même chemin à la casse près.",
                     "# Le premier annoncé dans le manifeste est celui qui a été installé.",
                     "# Sur Windows, les deux orthographes ouvrent ce fichier conservé.",
                     .. extraction.DoublonsIgnores]);
                progress.Report($"{extraction.DoublonsIgnores.Count} doublon(s) de casse ignoré(s) — voir doublons-ignores.txt");
            }
            if (authorization is not null)
            {
                File.Copy(authorization, Path.Combine(version, "autorisation-labo3.json"));
                // Empêche un changement de l'autorisation entre le premier contrôle et sa copie.
                Authorization.Check(Path.Combine(version, "autorisation-labo3.json"));
            }
            File.Copy(Environment.ProcessPath!, Path.Combine(version, "STI-Labo3-Installation.exe"));
            // Le raccourci est remplacé seulement après extraction et validation complètes.
            CreateShortcut(version);
            NettoyerVersions(root, version);
            return version;
        }
        catch { Directory.Delete(version, true); throw; }
    }
    private static void CreateShortcut(string version)
    {
        var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        var target = Path.Combine(desktop, Program.ProductName + ".lnk");
        var temporary = Path.Combine(desktop, ".sti-labo3-" + Guid.NewGuid().ToString("N") + ".lnk");
        try
        {
            var type = Type.GetTypeFromProgID("WScript.Shell") ?? throw new InvalidOperationException("Création du raccourci Windows indisponible.");
            dynamic shell = Activator.CreateInstance(type)!;
            try
            {
                dynamic shortcut = shell.CreateShortcut(temporary);
                try
                {
                    shortcut.TargetPath = Path.Combine(version, "STI-Labo3-Installation.exe");
                    shortcut.Arguments = "--launch";
                    shortcut.WorkingDirectory = version;
                    shortcut.Description = Program.ProductName;
                    shortcut.IconLocation = shortcut.TargetPath + ",0";
                    shortcut.Save();
                }
                finally { System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shortcut); }
            }
            finally { System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shell); }
            File.Move(temporary, target, true);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }
}
