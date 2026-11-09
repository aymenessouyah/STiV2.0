using System.Diagnostics;
using System.Net;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;

namespace STILabo3;

internal sealed class LocalRuntime : IAsyncDisposable
{
    private readonly WebApplication app;
    internal Uri LaunchUri { get; }
    private const int Port = 18763; // Origine stable pour les progressions locales du navigateur.
    private LocalRuntime(WebApplication application, string token) { app = application; LaunchUri = new Uri($"http://127.0.0.1:{Port}/__launch/{token}"); }
    internal static async Task<LocalRuntime> StartAsync(string versionDirectory)
    {
        Authorization.Check(Path.Combine(versionDirectory, "autorisation-labo3.json"));
        var root = Path.Combine(versionDirectory, "plateforme");
        if (!File.Exists(Path.Combine(root, "index.html"))) throw new IOException("Plateforme installée absente.");
        var builder = WebApplication.CreateBuilder();
        builder.Logging.ClearProviders();
        builder.WebHost.UseKestrel(o => o.Listen(IPAddress.Loopback, Port));
        var app = builder.Build();
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var mime = new FileExtensionContentTypeProvider();
        app.Run(async context =>
        {
            var request = context.Request;
            if (request.Host.Value != $"127.0.0.1:{Port}" || request.Method is not ("GET" or "HEAD")) { context.Response.StatusCode = 403; return; }
            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers.XContentTypeOptions = "nosniff";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; worker-src 'none'";
            if (request.Path == "/__launch/" + token)
            {
                context.Response.Cookies.Append("sti-labo3", token, new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.Strict, Path = "/" });
                context.Response.Redirect("/index.html"); return;
            }
            if (request.Cookies["sti-labo3"] != token) { context.Response.StatusCode = 403; return; }
            if (request.Headers.Origin.Count > 0 && request.Headers.Origin != $"http://127.0.0.1:{Port}") { context.Response.StatusCode = 403; return; }
            // Réévaluer la signature avant chaque document, pas seulement à l'installation.
            var relative = (request.Path.Value ?? "").TrimStart('/');
            if (relative == "") relative = "index.html";
            if (relative is "admin.html" or "portail.html" or "sw.js") { context.Response.StatusCode = 403; return; }
            string file;
            try
            {
                file = PackageInstaller.SafePath(root, relative);
                var current = root;
                foreach (var part in relative.Split('/'))
                {
                    current = Path.Combine(current, part);
                    if (Path.Exists(current) && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new IOException("Lien interdit.");
                }
            }
            catch { context.Response.StatusCode = 403; return; }
            if (!File.Exists(file)) { context.Response.StatusCode = 404; return; }
            if (Path.GetExtension(file).Equals(".html", StringComparison.OrdinalIgnoreCase))
            {
                try { Authorization.Check(Path.Combine(versionDirectory, "autorisation-labo3.json")); }
                catch { context.Response.StatusCode = 403; return; }
                var html = await File.ReadAllTextAsync(file);
                var head = html.IndexOf("<head", StringComparison.OrdinalIgnoreCase);
                var insertion = head < 0 ? -1 : html.IndexOf('>', head);
                if (insertion < 0) { context.Response.StatusCode = 422; return; }
                html = html.Insert(insertion + 1, Bootstrap);
                context.Response.ContentType = "text/html; charset=utf-8";
                if (request.Method != "HEAD") await context.Response.WriteAsync(html);
                return;
            }
            if (!mime.TryGetContentType(file, out var contentType)) contentType = "application/octet-stream";
            await Results.File(file, contentType, enableRangeProcessing: true).ExecuteAsync(context);
        });
        try { await app.StartAsync(); }
        catch { await app.DisposeAsync(); throw; }
        return new LocalRuntime(app, token);
    }
    internal void Open() => Process.Start(new ProcessStartInfo(LaunchUri.AbsoluteUri) { UseShellExecute = true });
    public async ValueTask DisposeAsync() { await app.StopAsync(); await app.DisposeAsync(); }

    // Adaptateur servi uniquement en local, après autorisation native. Ne modifie pas les sources du site.
    // Les noms V316 sont ceux du contrat existant dans acces.js, pas un ancien EXE.
    private const string Bootstrap = """
    <script>
    (()=>{
      const s={email:'elevelabo3@exemple.tn',nom:'Labo 3',prenom:'Poste',classe:'elevelabo3',statut:'actif',gold:true,isAdmin:false,permanent:true,nativeAuthenticated:true};
      sessionStorage.setItem('sti-native-session-v316','1');
      sessionStorage.setItem('sti-session-cache',JSON.stringify(s));
      localStorage.setItem('sti-session-cache',JSON.stringify(s));
      localStorage.setItem('sti-labo3-permanent',JSON.stringify(s));
      window.__STI_NATIVE_AUTHENTICATED_V316=true;
      // Le serveur fournit tous les fichiers ; aucun service worker ne doit conserver un accès hors contrôle.
      if(navigator.serviceWorker){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
        navigator.serviceWorker.register=()=>Promise.reject(new Error('Serveur local Labo3 : service worker désactivé'));}
    })();
    </script>
    """;
}
