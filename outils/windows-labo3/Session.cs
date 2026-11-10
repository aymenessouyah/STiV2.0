using System.Diagnostics;
using System.Net.Sockets;
using System.Text.Json;

namespace STILabo3;

/* Session locale sans fenêtre.

   Le serveur de la plateforme tourne dans un processus qui n'affiche rien :
   sa seule présence visible est une icône dans la zone de notification de la
   barre des tâches (double-clic = rouvrir le navigateur, clic droit = quitter).
   Un fichier d'état porte le port, le jeton de session et le pid du serveur :
   tout lancement suivant — raccourci du Bureau, double-clic sur l'EXE installé
   — rouvre donc directement la plateforme dans le navigateur, sans réafficher
   la boîte d'installation. Windows interdisant depuis Windows 7 d'épingler
   programmatiquement une icône à la barre des tâches, l'icône de notification
   est la présence permanente offerte ; l'épinglage central reste un geste
   utilisateur (clic droit sur le raccourci du Bureau). */
internal sealed record EtatSession(int Format, int Pid, int Port, string Uri, string Version, string DemarreLe);

internal static class Session
{
    internal const int FormatEtat = 1;

    internal static string CheminEtat() =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "STI-Labo3", "serveur.json");

    internal static bool PlateformePresente(string version) =>
        File.Exists(Path.Combine(version, "plateforme", "index.html"));

    /// Dossier servable : celui-ci s'il contient la plateforme, sinon la plus
    /// récente installée dans la racine donnée (jamais un dossier incomplet).
    internal static string? ResoudreVersion(string baseDirectory, string? racine = null)
    {
        if (PlateformePresente(baseDirectory)) return baseDirectory;
        racine ??= Deployment.RacineVersions();
        if (!Directory.Exists(racine)) return null;
        // Noms préfixés par un horodatage UTC : l'ordre lexicologique est l'ordre réel.
        return Directory.GetDirectories(racine)
            .Where(d => !Path.GetFileName(d).StartsWith('.'))
            .OrderByDescending(d => Path.GetFileName(d), StringComparer.Ordinal)
            .FirstOrDefault(PlateformePresente);
    }

    internal static void EcrireEtat(string chemin, EtatSession etat)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(chemin)!);
        var temporaire = chemin + ".tmp";
        File.WriteAllText(temporaire, JsonSerializer.Serialize(etat));
        File.Move(temporaire, chemin, true);
    }

    internal static EtatSession? LireEtat(string chemin)
    {
        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(chemin));
            var e = document.RootElement;
            if (e.GetProperty("Format").GetInt32() != FormatEtat) return null;
            return new EtatSession(
                e.GetProperty("Format").GetInt32(),
                e.GetProperty("Pid").GetInt32(),
                e.GetProperty("Port").GetInt32(),
                e.GetProperty("Uri").GetString() ?? "",
                e.GetProperty("Version").GetString() ?? "",
                e.GetProperty("DemarreLe").GetString() ?? "");
        }
        catch (Exception erreur) when (erreur is IOException or UnauthorizedAccessException or JsonException or ArgumentException)
        {
            // État absent, tronqué ou illisible : considéré comme mort, jamais une exception.
            return null;
        }
    }

    internal static void SupprimerEtat(string chemin)
    {
        try { File.Delete(chemin); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    /// Le pid doit exister ET porter le nom de notre exécutable : un pid réutilisé
    /// par un autre processus ne doit jamais passer pour un serveur vivant.
    internal static bool ProcessusVivant(int pid)
    {
        try
        {
            using var processus = Process.GetProcessById(pid);
            return !processus.HasExited &&
                processus.ProcessName.Equals("STI-Labo3-Installation", StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception erreur) when (erreur is ArgumentException or InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            return false;
        }
    }

    internal static async Task<bool> PortEcouteAsync(int port, int delaiMs = 700)
    {
        try
        {
            using var client = new TcpClient();
            var attente = client.ConnectAsync(System.Net.IPAddress.Loopback, port);
            if (await Task.WhenAny(attente, Task.Delay(delaiMs)) != attente) return false;
            await attente;
            return client.Connected;
        }
        catch (SocketException) { return false; }
        catch (ObjectDisposedException) { return false; }
    }

    internal static async Task<bool> ServeurEnVieAsync(EtatSession? etat)
    {
        if (etat is null || etat.Uri.Length == 0) return false;
        if (!ProcessusVivant(etat.Pid)) return false;
        return await PortEcouteAsync(etat.Port);
    }

    /// Attend qu'un autre lanceur publie un état vivant (double-clic simultané).
    internal static async Task<EtatSession?> AttendreServeurAsync(string chemin, int delaiMs)
    {
        var fin = Environment.TickCount64 + delaiMs;
        while (Environment.TickCount64 < fin)
        {
            var etat = LireEtat(chemin);
            if (await ServeurEnVieAsync(etat)) return etat;
            await Task.Delay(250);
        }
        return null;
    }

    internal static void OuvrirNavigateur(string uri) =>
        Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
}
