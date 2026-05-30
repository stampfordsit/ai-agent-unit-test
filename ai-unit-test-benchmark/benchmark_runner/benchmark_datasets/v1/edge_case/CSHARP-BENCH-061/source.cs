public class UserService
{
    public bool CreateUser(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return false;

        return true;
    }
}