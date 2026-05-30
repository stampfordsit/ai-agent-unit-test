public class TaxServiceTests
{
    [Fact]
    public void CalculateTax_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new TaxService();

        var result = service.CalculateTax(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateTax_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new TaxService();

        var result = service.CalculateTax(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void CalculateTax_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new TaxService();

        var result = service.CalculateTax(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void CalculateTax_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new TaxService();

        var result = service.CalculateTax(500, false);

        Assert.Equal(25, result);
    }
}