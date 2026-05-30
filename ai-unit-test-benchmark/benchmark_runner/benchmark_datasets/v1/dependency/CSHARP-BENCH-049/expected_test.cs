public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrderAsync_ShouldReturnOutOfStock_WhenStockUnavailable()
    {
        var inventory = new Mock<IInventoryService>();
        var payment = new Mock<IPaymentService>();

        inventory
            .Setup(x => x.HasStockAsync(1, 2))
            .ReturnsAsync(false);

        var service = new OrderService(inventory.Object, payment.Object);

        var result = await service.CreateOrderAsync(1, 2, 100);

        Assert.Equal("OUT_OF_STOCK", result);

        payment.Verify(
            x => x.ProcessPaymentAsync(It.IsAny<decimal>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldReturnPaymentFailed_WhenPaymentFails()
    {
        var inventory = new Mock<IInventoryService>();
        var payment = new Mock<IPaymentService>();

        inventory
            .Setup(x => x.HasStockAsync(1, 2))
            .ReturnsAsync(true);

        payment
            .Setup(x => x.ProcessPaymentAsync(100))
            .ReturnsAsync(false);

        var service = new OrderService(inventory.Object, payment.Object);

        var result = await service.CreateOrderAsync(1, 2, 100);

        Assert.Equal("PAYMENT_FAILED", result);
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldReturnSuccess_WhenPaymentSucceeds()
    {
        var inventory = new Mock<IInventoryService>();
        var payment = new Mock<IPaymentService>();

        inventory
            .Setup(x => x.HasStockAsync(1, 2))
            .ReturnsAsync(true);

        payment
            .Setup(x => x.ProcessPaymentAsync(100))
            .ReturnsAsync(true);

        var service = new OrderService(inventory.Object, payment.Object);

        var result = await service.CreateOrderAsync(1, 2, 100);

        Assert.Equal("SUCCESS", result);
    }
}