using System.Text.RegularExpressions;

public class EmailValidator
{
    public bool ValidateEmail(string email)
    {
        return Regex.IsMatch(
            email,
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }
}