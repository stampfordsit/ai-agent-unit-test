public class StringService
{
    public string Reverse(string value)
    {
        return new string(
            value.Reverse().ToArray());
    }
}