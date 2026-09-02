import { Controller, Post, Body, Bind, BadRequestException } from '@nestjs/common';
import https from 'https';

@Controller('v1/utils')
export class UtilsController {
  
  @Post('expand-maps-url')
  @Bind(Body())
  async expandMapsUrl(body) {
    const { url } = body;
    if (!url) throw new BadRequestException('URL is required');

    try {
      // Helper to follow redirect
      const finalUrl = await this.followRedirect(url);
      
      // Attempt to extract lat/lng from final URL
      // Pattern 1: @lat,lng
      const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const atMatch = finalUrl.match(atRegex);
      if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      }

      // Pattern 2: !3dlat!4dlng
      const bangRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
      const bangMatch = finalUrl.match(bangRegex);
      if (bangMatch) {
        return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]) };
      }

      // Pattern 3: query params (ll=lat,lng)
      const urlObj = new URL(finalUrl);
      const ll = urlObj.searchParams.get('ll');
      if (ll) {
        const [lat, lng] = ll.split(',');
        if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
      }

      throw new BadRequestException('Could not find coordinates in URL');
    } catch (e) {
      throw new BadRequestException('Failed to process URL: ' + e.message);
    }
  }

  followRedirect(url) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const req = https.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          // If no redirect, just return original URL
          resolve(url);
        }
      });
      req.on('error', (e) => reject(e));
      req.end();
    });
  }
}

