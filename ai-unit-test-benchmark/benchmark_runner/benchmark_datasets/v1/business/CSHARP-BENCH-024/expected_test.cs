public class RefundServiceTests
{
    [Fact]
    public void CalculateRefund_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new RefundService();

        var result = service.CalculateRefund(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateRefund_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new RefundService();

        var result = service.CalculateRefund(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculateRefund_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new RefundService();

        var result = service.CalculateRefund(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculateRefund_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new RefundService();

        var result = service.CalculateRefund(500, false);

        Assert.Equal(25, result);
    }
}