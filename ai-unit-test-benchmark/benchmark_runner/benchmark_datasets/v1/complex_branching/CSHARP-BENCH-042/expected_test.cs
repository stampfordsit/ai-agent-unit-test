public class RewardServiceTests
{
    [Fact]
    public void CalculateRewardTier_ShouldReturnInactive_WhenNotActive()
    {
        var service = new RewardService();

        var result = service.CalculateRewardTier(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void CalculateRewardTier_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new RewardService();

        var result = service.CalculateRewardTier(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void CalculateRewardTier_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new RewardService();

        var result = service.CalculateRewardTier(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void CalculateRewardTier_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new RewardService();

        var result = service.CalculateRewardTier(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void CalculateRewardTier_ShouldReturnBasic_WhenLowScore()
    {
        var service = new RewardService();

        var result = service.CalculateRewardTier(40, false, true);

        Assert.Equal("BASIC", result);
    }
}