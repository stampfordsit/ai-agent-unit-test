public class StringService
{
    public int GetLength(string? value)
    {
        if (value == null)
            return 0;

        return value.Length;
    }
}