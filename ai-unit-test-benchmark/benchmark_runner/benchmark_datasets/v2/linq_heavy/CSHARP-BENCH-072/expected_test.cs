public class OrderServiceTests
{
    [Fact]
    public void GetCustomerOrders_ShouldReturnJoinedResults()
    {
        var customers = new List<Customer>
        {
            new Customer { Id = 1, Name = "John" }
        };

        var orders = new List<Order>
        {
            new Order { Id = 100, CustomerId = 1 }
        };

        var service = new OrderService();

        var result = service.GetCustomerOrders(
            customers,
            orders);

        Assert.Single(result);
        Assert.Contains("John-100", result);
    }
}