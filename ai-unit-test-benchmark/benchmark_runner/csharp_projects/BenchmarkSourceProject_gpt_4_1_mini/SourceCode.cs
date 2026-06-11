
            namespace BenchmarkSourceProject;
            public class DownloadService
{
    public async Task<string> DownloadAsync()
    {
        await Task.Delay(100);

        return "OK";
    }
}
            