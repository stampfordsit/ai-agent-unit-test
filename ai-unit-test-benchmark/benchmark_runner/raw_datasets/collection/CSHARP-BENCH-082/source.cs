public class User
{
    public string Name { get; set; } = "";
    public bool IsActive { get; set; }
}

public class UserService
{
    public List<User> GetActiveUsers(List<User> users)
    {
        return users
            .Where(x => x.IsActive)
            .ToList();
    }
}