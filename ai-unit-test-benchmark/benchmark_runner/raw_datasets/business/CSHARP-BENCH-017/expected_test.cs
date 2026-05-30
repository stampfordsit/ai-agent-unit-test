[Fact]
public void ProcessInvoice_Member_ShouldApplyDiscountAndTax()
{
    var result = service.ProcessInvoice(1000, true);

    Assert.True(result > 0);
}

[Fact]
public void ProcessInvoice_InvalidSubtotal_ShouldThrowException()
{
    Assert.Throws<ArgumentException>(() =>
        service.ProcessInvoice(0, false));
}