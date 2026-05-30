public class Customer
{
    public string Name { get; set; } = "";
    public bool IsActive { get; set; }
    public decimal TotalSpent { get; set; }
}

public class CustomerService
{
    public List<string> GetTopCustomers(
        List<Customer> customers)
    {
        return customers
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.TotalSpent)
            .Take(3)
            .Select(x => x.Name)
            .ToList();
    }
}