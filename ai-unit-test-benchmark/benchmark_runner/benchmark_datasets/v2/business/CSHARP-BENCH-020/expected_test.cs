public class LoyaltyServiceTests
{
    [Fact]
    public void CalculatePoints_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new LoyaltyService();

        var result = service.CalculatePoints(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculatePoints_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new LoyaltyService();

        var result = service.CalculatePoints(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculatePoints_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new LoyaltyService();

        var result = service.CalculatePoints(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculatePoints_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new LoyaltyService();

        var result = service.CalculatePoints(500, false);

        Assert.Equal(25, result);
    }
}