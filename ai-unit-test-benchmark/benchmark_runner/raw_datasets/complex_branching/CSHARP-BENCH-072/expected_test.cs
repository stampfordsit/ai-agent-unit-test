public class TaxServiceTests
{
    [Fact]
    public void GetTaxCategory_ShouldReturnInactive_WhenNotActive()
    {
        var service = new TaxService();

        var result = service.GetTaxCategory(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetTaxCategory_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new TaxService();

        var result = service.GetTaxCategory(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetTaxCategory_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new TaxService();

        var result = service.GetTaxCategory(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetTaxCategory_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new TaxService();

        var result = service.GetTaxCategory(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetTaxCategory_ShouldReturnBasic_WhenLowScore()
    {
        var service = new TaxService();

        var result = service.GetTaxCategory(40, false, true);

        Assert.Equal("BASIC", result);
    }
}