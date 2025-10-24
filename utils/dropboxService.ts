import { Dropbox } from 'dropbox';

interface DropboxConfig {
  accessToken: string;
}

class DropboxService {
  private client: Dropbox;

  constructor(config: DropboxConfig) {
    if (!config.accessToken) {
      throw new Error('Dropbox access token is required');
    }
    
    this.client = new Dropbox({
      accessToken: config.accessToken,
      fetch: fetch
    });
  }

  async getCurrentAccount() {
    return await this.client.usersGetCurrentAccount();
  }

  async uploadFile(file: File, folderPath: string = '/chat-uploads'): Promise<{ fileId: string; url: string }> {
    try {
      if (!this.client) {
        throw new Error('Dropbox client not initialized');
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Ensure the path starts with '/'
      const fullPath = `${folderPath.startsWith('/') ? '' : '/'}${folderPath}/${file.name}`;

      console.log('Uploading file to Dropbox:', {
        path: fullPath,
        size: file.size,
        type: file.type
      });

      // Upload file to Dropbox
      const uploadResponse = await this.client.filesUpload({
        path: fullPath,
        contents: arrayBuffer,
      });

      // Create a shared link using the recommended method and ensure path_display is defined
      if (!uploadResponse.result.path_display) {
        throw new Error('Uploaded file does not have a valid path_display');
      }
      const sharedLinkResponse = await this.client.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_display,
      });

      // Convert shared link to direct download link
      const directLink = sharedLinkResponse.result.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');

      return {
        fileId: uploadResponse.result.id,
        url: directLink
      };
    } catch (error) {
      console.error('Dropbox upload failed:', error);
      throw new Error('Failed to upload file to Dropbox');
    }
  }

  async createFolder(path: string): Promise<void> {
    try {
      await this.client.filesCreateFolderV2({
        path: path,
        autorename: false
      });
    } catch (error: any) {
      // Ignore error if folder already exists
      if (error?.status !== 409) { // 409 means folder already exists
        throw error;
      }
    }
  }

  async getFileInfo(fileId: string) {
    try {
      const response = await this.client.filesGetMetadata({
        path: fileId
      });
      return response.result;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.client.filesDeleteV2({
        path: fileId
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async generateShareableLink(fileId: string) {
    try {
      const response = await this.client.sharingCreateSharedLinkWithSettings({
        path: fileId
      });
      return response.result.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      throw error;
    }
  }
}

const dropboxService = new DropboxService({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN || ''
});

export default dropboxService;