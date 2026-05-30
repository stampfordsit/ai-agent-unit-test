public class DiscountServiceTests
{
    [Fact]
    public void CalculateDiscount_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new DiscountService();

        var result = service.CalculateDiscount(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateDiscount_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new DiscountService();

        var result = service.CalculateDiscount(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculateDiscount_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new DiscountService();

        var result = service.CalculateDiscount(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculateDiscount_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new DiscountService();

        var result = service.CalculateDiscount(500, false);

        Assert.Equal(25, result);
    }
}