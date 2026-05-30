public bool IsValidEmail(string email)
{
    return email.Contains("@") && email.Contains(".");
}