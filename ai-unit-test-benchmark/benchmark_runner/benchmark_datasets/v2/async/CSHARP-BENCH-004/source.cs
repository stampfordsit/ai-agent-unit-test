public class RetryProcessor
{
    public async Task<bool> ProcessAsync()
    {
        int attempts = 0;

        while (attempts < 3)
        {
            attempts++;

            await Task.Delay(20);

            if (attempts == 3)
                return true;
        }

        return false;
    }
}