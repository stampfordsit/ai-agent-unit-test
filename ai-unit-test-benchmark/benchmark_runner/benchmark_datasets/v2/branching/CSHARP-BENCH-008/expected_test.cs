public class ShippingServiceTests
{
    [Fact]
    public void GetShippingStatus_ShouldReturnFreeExpress_WhenAmountAbove5000()
    {
        var service = new ShippingService();

        var result = service.GetShippingStatus(6000);

        Assert.Equal("FREE_EXPRESS", result);
    }

    [Fact]
    public void GetShippingStatus_ShouldReturnFreeStandard_WhenAmountAbove1000()
    {
        var service = new ShippingService();

        var result = service.GetShippingStatus(2000);

        Assert.Equal("FREE_STANDARD", result);
    }

    [Fact]
    public void GetShippingStatus_ShouldReturnPaid_WhenAmountBelow1000()
    {
        var service = new ShippingService();

        var result = service.GetShippingStatus(500);

        Assert.Equal("PAID", result);
    }
}