public class InsuranceServiceTests
{
    [Fact]
    public void CalculateRisk_ShouldReturnInactive_WhenNotActive()
    {
        var service = new InsuranceService();

        var result = service.CalculateRisk(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void CalculateRisk_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new InsuranceService();

        var result = service.CalculateRisk(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void CalculateRisk_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new InsuranceService();

        var result = service.CalculateRisk(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void CalculateRisk_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new InsuranceService();

        var result = service.CalculateRisk(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void CalculateRisk_ShouldReturnBasic_WhenLowScore()
    {
        var service = new InsuranceService();

        var result = service.CalculateRisk(40, false, true);

        Assert.Equal("BASIC", result);
    }
}