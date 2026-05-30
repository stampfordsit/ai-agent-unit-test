public class InvoiceServiceTests
{
    [Fact]
    public void GenerateInvoiceStatus_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new InvoiceService();

        var result = service.GenerateInvoiceStatus(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void GenerateInvoiceStatus_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new InvoiceService();

        var result = service.GenerateInvoiceStatus(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void GenerateInvoiceStatus_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new InvoiceService();

        var result = service.GenerateInvoiceStatus(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void GenerateInvoiceStatus_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new InvoiceService();

        var result = service.GenerateInvoiceStatus(500, false);

        Assert.Equal(25, result);
    }
}