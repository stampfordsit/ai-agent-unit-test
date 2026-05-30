public class SubscriptionServiceTests
{
    [Fact]
    public void CalculateSubscriptionFee_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new SubscriptionService();

        var result = service.CalculateSubscriptionFee(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateSubscriptionFee_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new SubscriptionService();

        var result = service.CalculateSubscriptionFee(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculateSubscriptionFee_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new SubscriptionService();

        var result = service.CalculateSubscriptionFee(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculateSubscriptionFee_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new SubscriptionService();

        var result = service.CalculateSubscriptionFee(500, false);

        Assert.Equal(25, result);
    }
}