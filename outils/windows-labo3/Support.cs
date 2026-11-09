namespace STILabo3;

// Ce que le support USB dépose à côté de l'exécutable : un paquet et une
// autorisation signée. Rien n'est téléchargé, rien n'est deviné au-delà.
internal static class Support
{
    internal static readonly string[] NomsAutorisation = ["autorisation-labo3.json", "autorisation.json"];

    internal sealed record Media(string? Paquet, string? Autorisation, string[] Paquets);

    internal static Media Resolve(string dossier)
    {
        if (!Directory.Exists(dossier)) return new Media(null, null, []);
        var paquets = Directory.GetFiles(dossier, "*.stipack").OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToArray();
        // Plusieurs paquets = ambiguïté : ne jamais choisir à la place de l'administrateur.
        var paquet = paquets.Length == 1 ? paquets[0] : null;
        string? autorisation = null;
        foreach (var nom in NomsAutorisation)
        {
            var chemin = Path.Combine(dossier, nom);
            if (File.Exists(chemin)) { autorisation = chemin; break; }
        }
        return new Media(paquet, autorisation, paquets);
    }

    internal static string Decrire(Media media)
    {
        var parties = new List<string>();
        if (media.Paquets.Length > 1) parties.Add($"{media.Paquets.Length} paquets .stipack trouvés — n'en garder qu'un");
        else if (media.Paquet is not null) parties.Add(Path.GetFileName(media.Paquet));
        else parties.Add("aucun paquet .stipack à côté de l'installateur");
        if (media.Autorisation is not null) parties.Add(Path.GetFileName(media.Autorisation));
        else parties.Add("aucune autorisation signée à côté de l'installateur");
        return string.Join(" · ", parties);
    }
}
