public class FileService
{
    public async Task<bool> SaveFileAsync(string content)
    {
        await Task.Delay(50);

        if (string.IsNullOrWhiteSpace(content))
            return false;

        return true;
    }
}