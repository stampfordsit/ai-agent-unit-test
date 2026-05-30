public class PromotionServiceTests
{
    [Fact]
    public void GetPromotion_ShouldReturnInactive_WhenNotActive()
    {
        var service = new PromotionService();

        var result = service.GetPromotion(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetPromotion_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new PromotionService();

        var result = service.GetPromotion(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetPromotion_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new PromotionService();

        var result = service.GetPromotion(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetPromotion_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new PromotionService();

        var result = service.GetPromotion(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetPromotion_ShouldReturnBasic_WhenLowScore()
    {
        var service = new PromotionService();

        var result = service.GetPromotion(40, false, true);

        Assert.Equal("BASIC", result);
    }
}