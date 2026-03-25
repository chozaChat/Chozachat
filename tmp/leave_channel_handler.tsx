  const handleLeaveChannel = async (channelId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channelId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to leave channel");
        return;
      }

      toast.success("Left channel successfully!");
      
      // Clear selected chat if this channel was selected
      if (selectedChat?.id === channelId) {
        setSelectedChat(null);
      }
      
      loadChannels();
    } catch (error) {
      console.error("Leave channel error:", error);
      toast.error("Failed to leave channel");
    }
  };
