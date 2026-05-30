public class ApiService
{
    public string FetchData(int timeout)
    {
        if (timeout > 5000)
            throw new TimeoutException(
                "Request timeout");

        return "DATA";
    }
}