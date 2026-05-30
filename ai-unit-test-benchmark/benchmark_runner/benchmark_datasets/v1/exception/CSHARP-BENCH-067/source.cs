public class UserService
{
    public string GetUserName(string? name)
    {
        if (name == null)
            throw new ArgumentNullException(nameof(name));

        return name;
    }
}