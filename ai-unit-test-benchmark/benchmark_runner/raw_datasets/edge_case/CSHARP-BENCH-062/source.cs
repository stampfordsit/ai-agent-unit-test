public class InventoryService
{
    public int RemoveStock(int currentStock, int quantity)
    {
        if (quantity > currentStock)
            throw new InvalidOperationException();

        return currentStock - quantity;
    }
}