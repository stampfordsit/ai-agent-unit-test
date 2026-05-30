public class ShippingServiceTests
{
    [Fact]
    public void CalculateShippingFee_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new ShippingService();

        var result = service.CalculateShippingFee(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateShippingFee_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new ShippingService();

        var result = service.CalculateShippingFee(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculateShippingFee_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new ShippingService();

        var result = service.CalculateShippingFee(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculateShippingFee_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new ShippingService();

        var result = service.CalculateShippingFee(500, false);

        Assert.Equal(25, result);
    }
}