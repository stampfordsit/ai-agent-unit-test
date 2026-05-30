public class CustomerServiceTests
{
    [Fact]
    public void GetTopCustomers_ShouldReturnTopActiveCustomers()
    {
        var customers = new List<Customer>
        {
            new Customer
            {
                Name = "Alice",
                IsActive = true,
                TotalSpent = 5000
            },
            new Customer
            {
                Name = "Bob",
                IsActive = true,
                TotalSpent = 3000
            },
            new Customer
            {
                Name = "Charlie",
                IsActive = false,
                TotalSpent = 10000
            }
        };

        var service = new CustomerService();

        var result = service.GetTopCustomers(customers);

        Assert.Equal(2, result.Count);
        Assert.Equal("Alice", result[0]);
        Assert.Equal("Bob", result[1]);
    }
}