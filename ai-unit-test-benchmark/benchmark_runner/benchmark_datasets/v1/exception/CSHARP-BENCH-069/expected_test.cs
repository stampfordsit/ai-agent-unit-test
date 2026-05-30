public class ApiServiceTests
{
    [Fact]
    public void FetchData_ShouldThrowTimeoutException_WhenTimeoutExceeded()
    {
        var service = new ApiService();

        Assert.Throws<TimeoutException>(
            () => service.FetchData(6000));
    }

    [Fact]
    public void FetchData_ShouldReturnData_WhenTimeoutValid()
    {
        var service = new ApiService();

        var result = service.FetchData(1000);

        Assert.Equal("DATA", result);
    }
}