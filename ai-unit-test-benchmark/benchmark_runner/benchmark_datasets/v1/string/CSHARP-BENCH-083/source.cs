public class TextService
{
    public string Normalize(string value)
    {
        return value
            .Trim()
            .ToLower();
    }
}