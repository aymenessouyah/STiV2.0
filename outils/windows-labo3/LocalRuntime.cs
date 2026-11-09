using System.Diagnostics;
using System.Net;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace STILabo3;

internal sealed class LocalRuntime : IAsyncDisposable
{
    private readonly WebApplication app;
    internal Uri LaunchUri { get; }

    // Port préféré, puis replis : en salle, un poste peut déjà occuper le premier.
    // Le dernier candidat (0) laisse le système choisir un port libre.
    internal static readonly int[] PortsEssayes = [18763, 18764, 18765, 18766, 18767, 0];

    private LocalRuntime(WebApplication application, Uri launchUri) { app = application; LaunchUri = launchUri; }

    internal static async Task<LocalRuntime> StartAsync(string versionDirectory, int[]? ports = null)
    {
        // Contrôlé une fois ici, puis avant chaque document servi — seulement si
        // une autorisation est installée (mode simple : aucune restriction).
        Authorization.CheckIfPresent(Path.Combine(versionDirectory, "autorisation-labo3.json"));
        Exception? derniere = null;
        foreach (var port in ports ?? PortsEssayes)
        {
            try { return await DemarrerAsync(versionDirectory, port); }
            catch (Exception erreur) when (erreur is AddressInUseException or IOException) { derniere = erreur; }
        }
        throw new InvalidOperationException("Aucun port local disponible pour servir la plateforme.", derniere);
    }

    private static async Task<LocalRuntime> DemarrerAsync(string versionDirectory, int port)
    {
        var root = Path.Combine(versionDirectory, "plateforme");
        if (!File.Exists(Path.Combine(root, "index.html"))) throw new InvalidOperationException("Plateforme installée absente.");
        var builder = WebApplication.CreateBuilder();
        builder.Logging.ClearProviders();
        builder.WebHost.UseKestrel(o => o.Listen(IPAddress.Loopback, port));
        var app = builder.Build();
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var mime = new FileExtensionContentTypeProvider();
        app.Run(async context =>
        {
            var request = context.Request;
            // Kestrel n'écoute que sur la boucle locale ; on refuse en plus tout
            // hôte qui ne la désigne pas, et toute requête cross-origin.
            var hote = request.Host.Host;
            if (hote is not ("127.0.0.1" or "localhost" or "[::1]" or "::1") || request.Method is not ("GET" or "HEAD"))
            { context.Response.StatusCode = 403; return; }
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
            if (request.Headers.Origin.Count > 0 && request.Headers.Origin != $"{request.Scheme}://{request.Host.Value}")
            { context.Response.StatusCode = 403; return; }
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
                try { Authorization.CheckIfPresent(Path.Combine(versionDirectory, "autorisation-labo3.json")); }
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
        try
        {
            await app.StartAsync();
            // Avec le port 0, l'adresse réelle n'est connue qu'après démarrage.
            var adresses = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()?.Addresses;
            var adresse = adresses is { Count: > 0 } ? adresses.First() : $"http://127.0.0.1:{port}";
            var origine = new Uri(adresse);
            return new LocalRuntime(app, new Uri(origine, "/__launch/" + token));
        }
        catch { await app.DisposeAsync(); throw; }
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
