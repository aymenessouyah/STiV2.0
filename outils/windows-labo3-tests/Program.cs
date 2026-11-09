using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using STILabo3;

var fixture = Path.GetFullPath(args[0]);
// Paquets fabriqués par le VRAI générateur du tableau de bord (facultatifs).
var paquetReel = args.Length > 1 && args[1].Length > 0 ? Path.GetFullPath(args[1]) : null;
var paquetRacine = args.Length > 2 && args[2].Length > 0 ? Path.GetFullPath(args[2]) : null;
var root = Path.Combine(Path.GetTempPath(), "sti-tests-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(root);
var passed = 0;
void Assert(bool condition, string message) { if (!condition) throw new Exception(message); passed++; }
async Task Refuse(Func<Task> action, string name)
{
    try { await action(); } catch { passed++; return; }
    throw new Exception("Refus attendu : " + name);
}
string Archive(string prefix, bool corrupt = false, string extra = "", string? fileName = null)
{
    var file = Path.Combine(root, Guid.NewGuid() + ".stipack");
    using var zip = ZipFile.Open(file, ZipArchiveMode.Create);
    var bytes = Encoding.UTF8.GetBytes("<!doctype html><html><head></head><body>Labo3</body></html>");
    var name = fileName ?? prefix + "index.html";
    using (var s = zip.CreateEntry(name).Open()) s.Write(bytes);
    using (var s = new StreamWriter(zip.CreateEntry("stipack.json").Open()))
        s.Write(JsonSerializer.Serialize(new { format = "STI-STIPACK/1", volume = "complet", contenu = new { dossier = prefix }, fichiers = new[] { new { chemin = name, octets = bytes.Length, sha256 = corrupt ? new string('0',64) : Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant() } } }));
    if (extra != "") { using var s = new StreamWriter(zip.CreateEntry(extra).Open()); s.Write("extra"); }
    return file;
}
try
{
    Authorization.Check(Path.Combine(fixture, "autorisation-labo3.json")); passed++;
    await Refuse(() => { Authorization.Check(Path.Combine(fixture, "refus.json")); return Task.CompletedTask; }, "autre poste");
    foreach (var path in new[] { "../x", "/x", "C:/x", "a\\b", "CON.txt", "x/../b", "a./b", "x:stream", "a//b" })
        await Refuse(() => { PackageInstaller.SafePath(root, path); return Task.CompletedTask; }, path);
    foreach (var prefix in new[] { "", "plateforme/" })
    {
        var destination = Path.Combine(root, Guid.NewGuid().ToString());
        await PackageInstaller.ExtractAsync(Archive(prefix), destination);
        Assert(File.Exists(Path.Combine(destination, "index.html")), "Accueil extrait pour " + prefix);
    }
    var bad = Path.Combine(root, "corrompu");
    await Refuse(() => PackageInstaller.ExtractAsync(Archive("", corrupt: true), bad), "SHA-256 incorrect");
    Assert(!Directory.Exists(bad), "Nettoyage extraction incomplète");
    await Refuse(() => PackageInstaller.ExtractAsync(Archive("", extra: "inconnu.txt"), Path.Combine(root, "extra")), "fichier non annoncé");
    await Refuse(() => PackageInstaller.ExtractAsync(Archive("", extra: "INDEX.HTML"), Path.Combine(root, "case")), "collision de casse");
    await Refuse(() => PackageInstaller.ExtractAsync(Archive("", fileName: "../index.html"), Path.Combine(root, "traversal")), "traversée");
    var existing = Path.Combine(root, "existing"); Directory.CreateDirectory(existing);
    File.WriteAllText(Path.Combine(existing, "temoin"), "conserver");
    await Refuse(() => PackageInstaller.ExtractAsync(Archive(""), existing), "destination existante");
    Assert(File.ReadAllText(Path.Combine(existing, "temoin")) == "conserver", "Ancienne version conservée");
    var version = Path.Combine(root, "runtime"); Directory.CreateDirectory(version);
    await PackageInstaller.ExtractAsync(Archive(""), Path.Combine(version, "plateforme"));
    File.WriteAllBytes(Path.Combine(version, "plateforme", "video.mp4"), new byte[] { 1, 2, 3, 4 });
    File.Copy(Path.Combine(fixture, "autorisation-labo3.json"), Path.Combine(version, "autorisation-labo3.json"));
    await using var runtime = await LocalRuntime.StartAsync(version);
    using var client = new HttpClient(new HttpClientHandler { UseCookies = true });
    var origin = runtime.LaunchUri.GetLeftPart(UriPartial.Authority);
    Assert((int)(await client.GetAsync(origin + "/index.html")).StatusCode == 403, "Accès sans cookie refusé");
    var html = await client.GetStringAsync(runtime.LaunchUri);
    Assert(html.Contains("__STI_NATIVE_AUTHENTICATED_V316=true"), "Session locale injectée");
    Assert((int)(await client.GetAsync(origin + "/admin.html")).StatusCode == 403, "Admin bloqué");
    using var request = new HttpRequestMessage(HttpMethod.Get, origin + "/video.mp4");
    request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(1, 2);
    using var response = await client.SendAsync(request);
    Assert((int)response.StatusCode == 206 && (await response.Content.ReadAsByteArrayAsync()).SequenceEqual(new byte[] { 2, 3 }), "Lecture vidéo partielle");
    // Port occupé : une seconde instance doit se replier sur un autre port, pas échouer.
    await using var seconde = await LocalRuntime.StartAsync(version);
    Assert(seconde.LaunchUri.Port != runtime.LaunchUri.Port, "Port de repli choisi quand le premier est occupé");
    Assert((await client.GetStringAsync(seconde.LaunchUri)).Contains("__STI_NATIVE_AUTHENTICATED_V316=true"), "Seconde instance sert la plateforme");
    Assert(LocalRuntime.PortsEssayes[^1] == 0, "Dernier candidat : port libre choisi par le système");

    File.Copy(Path.Combine(fixture, "refus.json"), Path.Combine(version, "autorisation-labo3.json"), true);
    Assert((int)(await client.GetAsync(origin + "/index.html")).StatusCode == 403, "Autorisation recontrôlée au lancement document");
    await Refuse(() => LocalRuntime.StartAsync(version), "démarrage refusé si l’autorisation a été remplacée");

    // Purge des anciennes versions : les plus récentes restent, la protégée jamais supprimée.
    var versions = Path.Combine(root, "versions");
    Directory.CreateDirectory(versions);
    string[] noms = ["20260101-000000-a", "20260102-000000-b", "20260103-000000-c", "20260104-000000-d"];
    foreach (var nom in noms) Directory.CreateDirectory(Path.Combine(versions, nom));
    Deployment.NettoyerVersions(versions, Path.Combine(versions, noms[0]), conserver: 2);
    Assert(Directory.Exists(Path.Combine(versions, noms[3])) && Directory.Exists(Path.Combine(versions, noms[2])), "Deux versions les plus récentes conservées");
    Assert(!Directory.Exists(Path.Combine(versions, noms[1])), "Version ancienne purgée");
    Assert(Directory.Exists(Path.Combine(versions, noms[0])), "Version protégée conservée même si ancienne");
    Deployment.NettoyerVersions(Path.Combine(root, "absent"), null);
    passed++; // racine inexistante tolérée

    // Marge d'espace disque : logique pure, le disque du runner n'est pas saturable.
    Assert(Deployment.EspaceSuffisant(1000, 5000, 100), "Espace suffisant avec marge");
    Assert(!Deployment.EspaceSuffisant(1000, 1050, 100), "Marge non respectée : refus");
    Assert(!Deployment.EspaceSuffisant(-1, long.MaxValue, 100), "Taille négative refusée");
    // Support USB : détection du paquet et de l'autorisation à côté de l'exécutable.
    var support = Path.Combine(root, "support");
    Directory.CreateDirectory(support);
    Assert(Support.Resolve(support).Paquet is null, "Dossier vide : aucun paquet inventé");
    Assert(Support.Resolve(support).Autorisation is null, "Dossier vide : aucune autorisation inventée");
    Assert(Support.Resolve(Path.Combine(root, "absent")).Paquet is null, "Dossier inexistant toléré");
    var paquetSupport = Archive("");
    File.Move(paquetSupport, Path.Combine(support, "STI-Labo3-Plateforme.stipack"));
    File.Copy(Path.Combine(fixture, "autorisation-labo3.json"), Path.Combine(support, "autorisation-labo3.json"));
    var detecte = Support.Resolve(support);
    Assert(detecte.Paquet is not null && detecte.Autorisation is not null, "Paquet et autorisation détectés");
    Assert(Support.Decrire(detecte).Contains("STI-Labo3-Plateforme.stipack"), "Description du support");
    File.Copy(Path.Combine(support, "STI-Labo3-Plateforme.stipack"), Path.Combine(support, "ancien.stipack"));
    var ambigu = Support.Resolve(support);
    Assert(ambigu.Paquet is null && ambigu.Paquets.Length == 2, "Deux paquets : aucun choix automatique");
    Assert(Support.Decrire(ambigu).Contains("n'en garder qu'un"), "Ambiguïté expliquée");
    File.Delete(Path.Combine(support, "ancien.stipack"));
    // Second nom accepté, sans cumuler les deux fichiers d'autorisation.
    File.Move(Path.Combine(support, "autorisation-labo3.json"), Path.Combine(support, "autorisation.json"));
    Assert(Support.Resolve(support).Autorisation is not null, "autorisation.json accepté");

    /* Contrat de format contre le générateur réel : si assets/js/stipack.js change
       de schéma, l'installateur doit cesser de passer ici, pas en salle. */
    foreach (var reel in new[] { (paquetReel, "plateforme/"), (paquetRacine, "racine") })
    {
        if (reel.Item1 is null) continue;
        var destination = Path.Combine(root, "reel-" + Guid.NewGuid().ToString("N"));
        await PackageInstaller.ExtractAsync(reel.Item1, destination);
        Assert(File.Exists(Path.Combine(destination, "index.html")), $"Paquet réel ({reel.Item2}) : accueil extrait");
        Assert(File.Exists(Path.Combine(destination, "assets", "js", "config.js")), $"Paquet réel ({reel.Item2}) : sous-dossiers extraits");
        Assert(!File.Exists(Path.Combine(destination, "stipack.json")), $"Paquet réel ({reel.Item2}) : manifeste non copié dans la plateforme");
        Assert(!File.Exists(Path.Combine(destination, "plateforme")), $"Paquet réel ({reel.Item2}) : préfixe retiré");
    }
    if (paquetReel is not null)
    {
        var versionReelle = Path.Combine(root, "version-reelle");
        Directory.CreateDirectory(versionReelle);
        await PackageInstaller.ExtractAsync(paquetReel, Path.Combine(versionReelle, "plateforme"));
        File.Copy(Path.Combine(fixture, "autorisation-labo3.json"), Path.Combine(versionReelle, "autorisation-labo3.json"));
        await using var runtimeReel = await LocalRuntime.StartAsync(versionReelle);
        // Cookie propre à cette instance : les cookies ne distinguent pas les ports.
        var pageReelle = await client.GetStringAsync(runtimeReel.LaunchUri);
        Assert(pageReelle.Contains("<html"), "index.html réel servi");
        Assert(pageReelle.Contains("__STI_NATIVE_AUTHENTICATED_V316=true"), "index.html réel : session locale injectée");
        var origineReelle = runtimeReel.LaunchUri.GetLeftPart(UriPartial.Authority);
        Assert((await client.GetAsync(origineReelle + "/assets/js/config.js")).IsSuccessStatusCode, "asset réel servi");
        Assert((await client.GetAsync(origineReelle + "/assets/icons/sti-icon-192.png")).IsSuccessStatusCode, "image réelle servie");
        Assert((int)(await client.GetAsync(origineReelle + "/portail.html")).StatusCode == 403, "portail bloqué sur contenu réel");
    }

    Console.WriteLine($"{passed} contrôles Windows réussis.");
}
finally { Directory.Delete(root, true); }
