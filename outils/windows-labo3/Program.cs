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
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new PreparationForm());
    }
}

// Préversion volontairement sans installation : aucune ancienne application supprimée.
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
        layout.Controls.Add(new Label { Text = "PRÉVERSION — contrôle d’autorisation uniquement. Pas encore d’installation.", AutoSize = true, ForeColor = Color.Firebrick });
        layout.Controls.Add(new Label { Text = "Sans compte du portail, sans mot de passe et sans accès réseau.", AutoSize = true });
        var check = new Button { Text = "Vérifier une autorisation signée pour ce poste", AutoSize = true, Padding = new Padding(8) };
        check.Click += (_, _) => CheckAuthorization();
        layout.Controls.Add(check);
        layout.Controls.Add(new Button { Text = "Installer — indisponible dans cette préversion", Enabled = false, AutoSize = true });
        status.Width = 720;
        status.Text = "Aucune modification ne sera apportée au poste. Le moteur d’installation et le lancement local restent à réaliser.";
        layout.Controls.Add(status); Controls.Add(layout);
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
