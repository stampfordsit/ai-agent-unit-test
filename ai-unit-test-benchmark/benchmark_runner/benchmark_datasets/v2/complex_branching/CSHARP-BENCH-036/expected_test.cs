public class LoanServiceTests
{
    [Fact]
    public void CheckLoanApproval_ShouldReturnInactive_WhenNotActive()
    {
        var service = new LoanService();

        var result = service.CheckLoanApproval(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void CheckLoanApproval_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new LoanService();

        var result = service.CheckLoanApproval(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void CheckLoanApproval_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new LoanService();

        var result = service.CheckLoanApproval(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void CheckLoanApproval_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new LoanService();

        var result = service.CheckLoanApproval(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void CheckLoanApproval_ShouldReturnBasic_WhenLowScore()
    {
        var service = new LoanService();

        var result = service.CheckLoanApproval(40, false, true);

        Assert.Equal("BASIC", result);
    }
}