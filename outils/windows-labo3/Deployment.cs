using System.Reflection;

namespace STILabo3;

internal static class Deployment
{
    internal static async Task<string> InstallAsync(string package, string authorization, IProgress<string> progress)
    {
        Authorization.Check(authorization);
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "STI-Labo3", "versions");
        Directory.CreateDirectory(root);
        var version = Path.Combine(root, DateTime.UtcNow.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(version);
        try
        {
            await PackageInstaller.ExtractAsync(package, Path.Combine(version, "plateforme"), progress);
            File.Copy(authorization, Path.Combine(version, "autorisation-labo3.json"));
            // Empêche un changement de l'autorisation entre le premier contrôle et sa copie.
            Authorization.Check(Path.Combine(version, "autorisation-labo3.json"));
            File.Copy(Environment.ProcessPath!, Path.Combine(version, "STI-Labo3-Installation.exe"));
            // Le raccourci est remplacé seulement après extraction et validation complètes.
            CreateShortcut(version);
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
