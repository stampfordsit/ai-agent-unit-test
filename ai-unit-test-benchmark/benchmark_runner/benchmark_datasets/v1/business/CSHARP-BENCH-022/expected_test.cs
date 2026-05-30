public class PromotionServiceTests
{
    [Fact]
    public void ApplyPromotion_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new PromotionService();

        var result = service.ApplyPromotion(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void ApplyPromotion_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new PromotionService();

        var result = service.ApplyPromotion(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void ApplyPromotion_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new PromotionService();

        var result = service.ApplyPromotion(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void ApplyPromotion_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new PromotionService();

        var result = service.ApplyPromotion(500, false);

        Assert.Equal(25, result);
    }
}