public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
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

    public async Task<User?> GetUserAsync(int id)
    {
        return await _repo.GetByIdAsync(id);
    }
}