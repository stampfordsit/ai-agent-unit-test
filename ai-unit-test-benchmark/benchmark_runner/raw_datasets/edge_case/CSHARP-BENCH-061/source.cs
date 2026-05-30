public class EmailValidator
{
    public bool ValidateEmail(string email)
    {
        if (!email.Contains("@"))
            return false;

        return true;
    }
}