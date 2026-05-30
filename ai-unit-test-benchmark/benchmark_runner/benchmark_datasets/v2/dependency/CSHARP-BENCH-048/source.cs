public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task DeleteAsync(User user);
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class UserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
            return false;

        await _repo.DeleteAsync(user);

        return true;
    }
}