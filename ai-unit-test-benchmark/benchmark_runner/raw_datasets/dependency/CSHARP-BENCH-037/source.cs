public interface IDataRepository
{
    Task<string> LoadAsync(
        CancellationToken cancellationToken);
}

public class DataService
{
    private readonly IDataRepository _repo;

    public DataService(IDataRepository repo)
    {
        _repo = repo;
    }

    public async Task<string> GetDataAsync(
        CancellationToken cancellationToken)
    {
        return await _repo.LoadAsync(cancellationToken);
    }
}