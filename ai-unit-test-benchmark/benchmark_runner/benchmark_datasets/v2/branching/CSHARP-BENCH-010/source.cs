public class UserService
{
    public string GetUserRole(bool isAdmin)
    {
        return isAdmin ? "ADMIN" : "USER";
    }
}