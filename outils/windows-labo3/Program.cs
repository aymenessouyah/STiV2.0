using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Win32;
using NSec.Cryptography;

namespace STILabo3;

internal static class Program
{
    internal const string ProductName = "STI v2.0 version spéciale Labo 3";
    [STAThread]
    private static void Main(string[] args)
    {
        // Contrôle de publication : empreinte de la clé publique réellement embarquée.
        if (args.Length == 2 && args[0] == "--afficher-cle")
        {
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("STILabo3.PublicKey.pem");
            var empreinte = stream is null ? "ABSENTE" : Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
            File.WriteAllText(args[1], empreinte);
            return;
        }
        ApplicationConfiguration.Initialize();
        // Raccourci du Bureau et EXE installé : aucune boîte d'installation, le
        // serveur tourne sans fenêtre et le navigateur s'ouvre directement.
        if (args.Contains("--launch")) { Application.Run(new SessionContext()); return; }
        Application.Run(new PreparationForm());
    }

    /// Relance l'EXE installé en mode silencieux : il réutilise un serveur déjà
    /// vivant ou en démarre un, puis ouvre le navigateur. Rien n'est affiché.
    internal static Process Relancer(string versionDirectory)
    {
        var exe = Path.Combine(versionDirectory, "STI-Labo3-Installation.exe");
        return Process.Start(new ProcessStartInfo(exe, "--launch")
        { UseShellExecute = true, WorkingDirectory = versionDirectory });
    }
}

// Lancement silencieux : pas de fenêtre, une icône dans la zone de notification
// de la barre des tâches (double-clic = rouvrir, clic droit = ouvrir / quitter).
// Un mutex par session utilisateur garantit un seul serveur : le deuxième
// lancement se contente d'ouvrir le navigateur puis s'efface.
internal sealed class SessionContext : ApplicationContext
{
    private readonly NotifyIcon icone;
    private readonly Mutex mutex;
    private readonly bool possede;
    private LocalRuntime? runtime;
    private bool mutexLibere;

    public SessionContext()
    {
        mutex = new Mutex(true, @"Local\STI-Labo3-Session", out possede);
        using var flux = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("STILabo3.Icon.ico")!;
        icone = new NotifyIcon { Icon = new Icon(flux), Text = Program.ProductName, Visible = false };
        var menu = new ContextMenuStrip();
        menu.Items.Add("Ouvrir la plateforme", null, (_, _) => runtime?.Open());
        menu.Items.Add("Quitter", null, async (_, _) => await QuitterAsync());
        icone.ContextMenuStrip = menu;
        icone.MouseDoubleClick += (_, _) => runtime?.Open();
        DemarrerAsync();
    }

    private async void DemarrerAsync()
    {
        try
        {
            var chemin = Session.CheminEtat();
            if (!possede)
            {
                // Un autre lancement possède le mutex : on attend son état, on
                // ouvre le navigateur à sa place, puis on s'efface sans fenêtre.
                var attendu = await Session.AttendreServeurAsync(chemin, 8000);
                if (attendu is null) throw new InvalidOperationException("Un lancement est déjà en cours mais aucun serveur local n'apparaît.");
                Session.OuvrirNavigateur(attendu.Uri);
                await QuitterAsync();
                return;
            }
            var etat = Session.LireEtat(chemin);
            if (await Session.ServeurEnVieAsync(etat))
            {
                Session.OuvrirNavigateur(etat!.Uri);
                await QuitterAsync();
                return;
            }
            var version = Session.ResoudreVersion(AppContext.BaseDirectory)
                ?? throw new InvalidOperationException("Aucune plateforme installée sur ce poste : relancer l'installation depuis la clé USB.");
            runtime = await LocalRuntime.StartAsync(version);
            Session.EcrireEtat(chemin, new EtatSession(Session.FormatEtat, Environment.ProcessId,
                runtime.LaunchUri.Port, runtime.LaunchUri.AbsoluteUri, version, DateTime.UtcNow.ToString("o")));
            icone.Visible = true;
            runtime.Open();
        }
        catch (Exception e)
        {
            icone.Visible = false;
            MessageBox.Show(e.Message, Program.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            await QuitterAsync();
        }
    }

    private async Task QuitterAsync()
    {
        icone.Visible = false;
        if (runtime is not null)
        {
            Session.SupprimerEtat(Session.CheminEtat());
            await runtime.DisposeAsync();
            runtime = null;
        }
        if (possede && !mutexLibere)
        {
            mutexLibere = true;
            try { mutex.ReleaseMutex(); } catch (ApplicationException) { }
        }
        ExitThread();
    }
}

// Installation par version : aucune ancienne application supprimée.
internal sealed class PreparationForm : Form
{
    private readonly Label status = new() { AutoSize = false, Height = 100, Dock = DockStyle.Top };
    public PreparationForm()
    {
        Text = Program.ProductName;
        Width = 820; Height = 530; MinimumSize = new Size(720, 480);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 11); BackColor = Color.White;
        using var iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("STILabo3.Icon.ico")!;
        Icon = new Icon(iconStream);
        var layout = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true, Padding = new Padding(24) };
        using var logoStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("STILabo3.Logo.png")!;
        using var image = Image.FromStream(logoStream);
        layout.Controls.Add(new PictureBox { Image = new Bitmap(image), Size = new Size(110, 90), SizeMode = PictureBoxSizeMode.Zoom });
        layout.Controls.Add(new Label { Text = Program.ProductName, AutoSize = true, Font = new Font("Segoe UI", 18, FontStyle.Bold) });
        layout.Controls.Add(new Label { Text = "Validé sous Windows par GitHub Actions. Sans compte du portail, sans mot de passe, sans accès réseau.", AutoSize = true });
        layout.Controls.Add(new Label { Text = "Copiez ce dossier sur la clé USB avec le paquet .stipack, puis cliquez sur Installer.", AutoSize = true });
        var check = new Button { Text = "Option restreinte : vérifier une autorisation signée pour ce poste", AutoSize = true, Padding = new Padding(8) };
        check.Click += (_, _) => CheckAuthorization();
        layout.Controls.Add(check);
        var install = new Button { Text = "Installer depuis le support USB", AutoSize = true, Padding = new Padding(8) };
        install.Click += async (_, _) => await InstallerDepuisSupportAsync(install);
        layout.Controls.Add(install);
        var reopen = new Button { Text = "Rouvrir la plateforme locale", AutoSize = true };
        reopen.Click += (_, _) =>
        {
            var version = Session.ResoudreVersion(AppContext.BaseDirectory);
            if (version is null)
            {
                status.ForeColor = Color.Firebrick;
                status.Text = "Aucune plateforme installée sur ce poste : installer d’abord depuis le support.";
                return;
            }
            Program.Relancer(version);
            status.ForeColor = Color.DarkGreen;
            status.Text = "Plateforme rouverte : le serveur tourne sans fenêtre, icône dans la barre des tâches.";
        };
        layout.Controls.Add(reopen);
        status.Width = 720;
        var support = Support.Resolve(AppContext.BaseDirectory);
        status.Text = support.Paquet is not null
            ? "Support détecté à côté de l’installateur : " + Support.Decrire(support) + ". Cliquez sur Installer."
            : "Aucun paquet à côté de l’installateur : il vous sera demandé. Aucun mot de passe requis. Les anciennes versions sont conservées.";
        layout.Controls.Add(status); Controls.Add(layout);
    }
    private async Task InstallerDepuisSupportAsync(Button bouton)
    {
        if (await Session.ServeurEnVieAsync(Session.LireEtat(Session.CheminEtat())))
        {
            status.ForeColor = Color.Firebrick;
            status.Text = "La plateforme tourne déjà : icône de la barre des tâches → « Quitter », puis relancer la mise à jour.";
            return;
        }
        var media = Support.Resolve(AppContext.BaseDirectory);
        if (media.Paquets.Length > 1)
        {
            status.ForeColor = Color.Firebrick;
            status.Text = "Plusieurs paquets .stipack à côté de l’installateur : n’en garder qu’un, puis relancer.";
            return;
        }
        var paquet = media.Paquet;
        // L'autorisation est optionnelle : absente, l'installation se fait sans
        // restriction de postes ; présente, elle est vérifiée à chaque étape.
        var autorisation = media.Autorisation;
        if (paquet is null)
        {
            status.Text = "Aucun paquet .stipack à côté de l’installateur (" + Support.Decrire(media) + "). Sélection manuelle…";
            using var choix = new OpenFileDialog { Filter = "Paquet complet (*.stipack)|*.stipack", CheckFileExists = true };
            if (choix.ShowDialog(this) != DialogResult.OK) return;
            paquet = choix.FileName;
        }
        if (media.Paquet is not null)
        {
            // Un seul clic par poste : le support porte déjà le paquet.
            var reponse = MessageBox.Show(this,
                "Installer depuis le support détecté ?\n\n" + paquet +
                (autorisation is null
                    ? "\n\nAucune autorisation sur le support : installation sans restriction de postes."
                    : "\n" + autorisation + "\n\nAutorisation signée détectée : ce poste doit figurer dans la liste.") +
                "\n\nAucun mot de passe n’est demandé. En cas d’échec, l’ancienne version est conservée.",
                Program.ProductName, MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
            if (reponse != DialogResult.OK) return;
        }
        bouton.Enabled = false;
        try
        {
            var progression = new Progress<string>(texte => status.Text = texte);
            status.ForeColor = Color.Black;
            var version = await Deployment.InstallAsync(paquet, autorisation, progression);
            status.ForeColor = Color.DarkGreen;
            status.Text = "Installation validée. Raccourci créé sur le Bureau. Ouverture locale…";
            // Le serveur vit désormais dans un processus silencieux (icône dans
            // la barre des tâches) : la boîte d'installation s'efface aussitôt.
            Program.Relancer(version);
            Close();
        }
        catch (Exception e) { status.ForeColor = Color.Firebrick; status.Text = "Installation impossible : " + e.Message + " L’ancienne version est conservée."; }
        finally { bouton.Enabled = true; }
    }

    private void CheckAuthorization()
    {
        using var picker = new OpenFileDialog { Filter = "Autorisation Labo3 (*.json)|*.json", CheckFileExists = true };
        if (picker.ShowDialog(this) != DialogResult.OK) return;
        try
        {
            Authorization.Check(picker.FileName);
            status.ForeColor = Color.DarkGreen;
            status.Text = "Autorisation valide pour ce poste. Cela ne signifie pas que la plateforme est installée.";
        }
        catch (Exception e) { status.ForeColor = Color.Firebrick; status.Text = "Refus : " + e.Message; }
    }
}

internal static class Authorization
{
    /* Mode simple : quand le support ne porte aucune autorisation, l'installation
       et l'exécution se font sans restriction de postes. Dès que le fichier est
       présent il est vérifié — une autorisation posée sur le support n'est jamais
       ignorée, et un poste hors liste est alors refusé. */
    internal static bool CheckIfPresent(string file)
    {
        if (!File.Exists(file)) return false;
        Check(file);
        return true;
    }

    internal static void Check(string file)
    {
        // La clé de confiance est embarquée à la compilation : ne jamais lire une clé de l’USB.
        using var keyStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("STILabo3.PublicKey.pem")
            ?? throw new InvalidOperationException("Cette préversion n’a pas de clé publique de confiance intégrée.");
        using var reader = new StreamReader(keyStream);
        var pem = reader.ReadToEnd();
        var block = PemEncoding.Find(pem.AsSpan());
        if (pem[block.Label] != "PUBLIC KEY") throw new InvalidOperationException("Clé publique SPKI requise.");
        var spki = Convert.FromBase64String(pem[block.Base64Data]);
        // SubjectPublicKeyInfo Ed25519 RFC 8410 : refuse un autre algorithme/encodage.
        byte[] prefix = Convert.FromHexString("302A300506032B6570032100");
        if (spki.Length != 44 || !spki.AsSpan(0, 12).SequenceEqual(prefix)) throw new InvalidOperationException("Clé Ed25519 invalide.");
        var key = PublicKey.Import(SignatureAlgorithm.Ed25519, spki.AsSpan(12), KeyBlobFormat.RawPublicKey);
        if (new FileInfo(file).Length > 65536) throw new InvalidOperationException("Autorisation trop volumineuse.");
        using var envelope = JsonDocument.Parse(File.ReadAllText(file));
        var root = envelope.RootElement;
        if (root.GetProperty("algorithme").GetString() != "Ed25519") throw new InvalidOperationException("Algorithme refusé.");
        var bytes = Convert.FromBase64String(root.GetProperty("donnees").GetString()!);
        var signature = Convert.FromBase64String(root.GetProperty("signature").GetString()!);
        if (!SignatureAlgorithm.Ed25519.Verify(key, bytes, signature)) throw new InvalidOperationException("Signature invalide.");
        using var document = JsonDocument.Parse(bytes);
        var data = document.RootElement;
        if (data.GetProperty("format").GetString() != "STI-LABO3-AUTORISATION/1" || data.GetProperty("laboratoire").GetString() != "Labo3")
            throw new InvalidOperationException("Format ou laboratoire refusé.");
        var machines = data.GetProperty("postes").EnumerateArray().Select(p => p.GetString() ?? "").ToArray();
        if (machines.Length is < 1 or > 20 || machines.Distinct().Count() != machines.Length || machines.Any(p => !System.Text.RegularExpressions.Regex.IsMatch(p, "\\A[0-9a-f]{64}\\z")))
            throw new InvalidOperationException("Liste de postes invalide.");
        using var registry = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        using var crypto = registry.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
        var guid = Guid.Parse(crypto?.GetValue("MachineGuid") as string ?? "").ToString("D").ToLowerInvariant();
        var fingerprint = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("STI-LABO3/1\n" + guid))).ToLowerInvariant();
        if (!machines.Contains(fingerprint)) throw new InvalidOperationException("Ce poste n’est pas autorisé pour le Labo 3.");
    }
}
