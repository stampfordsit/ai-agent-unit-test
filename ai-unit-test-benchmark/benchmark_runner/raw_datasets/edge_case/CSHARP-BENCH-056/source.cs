public class CollectionService
{
    public int GetFirstItem(List<int> items)
    {
        if (items.Count == 0)
            throw new InvalidOperationException();

        return items[0];
    }
}