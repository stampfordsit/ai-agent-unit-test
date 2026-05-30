public interface IApiClient
{
    Task<bool> SendAsync();
}

public class RetryService
{
    private readonly IApiClient _client;

    public RetryService(IApiClient client)
    {
        _client = client;
    }

    public async Task<bool> ExecuteAsync()
    {
        for (int i = 0; i < 3; i++)
        {
            var success = await _client.SendAsync();

            if (success)
                return true;
        }

        return false;
    }
}