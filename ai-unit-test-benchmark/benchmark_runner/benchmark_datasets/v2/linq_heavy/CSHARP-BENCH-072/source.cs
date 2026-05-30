public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
}

public class OrderService
{
    public List<string> GetCustomerOrders(
        List<Customer> customers,
        List<Order> orders)
    {
        return customers.Join(
            orders,
            c => c.Id,
            o => o.CustomerId,
            (c, o) => $"{c.Name}-{o.Id}")
            .ToList();
    }
}