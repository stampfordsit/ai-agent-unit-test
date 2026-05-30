public class GradeServiceTests
{
    [Fact]
    public void GetGrade_ShouldReturnInactive_WhenNotActive()
    {
        var service = new GradeService();

        var result = service.GetGrade(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetGrade_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new GradeService();

        var result = service.GetGrade(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetGrade_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new GradeService();

        var result = service.GetGrade(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetGrade_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new GradeService();

        var result = service.GetGrade(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetGrade_ShouldReturnBasic_WhenLowScore()
    {
        var service = new GradeService();

        var result = service.GetGrade(40, false, true);

        Assert.Equal("BASIC", result);
    }
}